/*
 * Copyright (C) 2017 Dremio Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.dremio.exec.physical.base;

import java.util.List;

import com.dremio.exec.physical.MinorFragmentEndpoint;
import com.dremio.exec.record.BatchSchema;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * A sender is one half of an exchange node operations. It is responsible for subdividing/cloning and sending a local
 * record set to a set of destination locations. This is typically only utilized at the level of the execution plan.
 */
public interface Sender extends FragmentRoot {

  /**
   * Get the list of destination endpoints that this Sender will be communicating with.
   * @return List of receiver MinorFragmentEndpoints each containing receiver fragment MinorFragmentId and endpoint
   * where it is running.
   */
  public abstract List<MinorFragmentEndpoint> getDestinations();

  /**
   * Get the receiver major fragment id that is opposite this sender.
   * @return
   */
  @JsonProperty("receiver-major-fragment")
  public int getOppositeMajorFragmentId();

  public PhysicalOperator getChild();

  BatchSchema getSchema();
}